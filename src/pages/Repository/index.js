import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { MdNavigateBefore, MdNavigateNext } from 'react-icons/md';
import PropTypes from 'prop-types';
import api from '../../services/api';

import Container from '../../components/Container';
import { Loading, Owner, IssueList, ListNavigation, Filter } from './styles';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    page: 1,
    status: 'open',
  };

  async componentDidMount() {
    const { match } = this.props;
    const { page, status } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: status,
          per_page: 5,
          page,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  handleStatus(e) {
    this.setState(
      {
        status: e.target.value,
      },
      this.reload
    );
  }

  incrementPage() {
    const { page } = this.state;

    this.setState(
      {
        page: page + 1,
      },
      this.reload
    );
  }

  decrementPage() {
    const { page } = this.state;
    if (page === 1) return;
    this.setState(
      {
        page: page - 1,
      },
      this.reload
    );
  }

  async reload() {
    const { repository, page, status } = this.state;

    const repoName = repository.full_name;
    const issues = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: status,
        per_page: 5,
        page,
      },
    });

    this.setState({
      issues: issues.data,
    });
  }

  render() {
    const { repository, issues, loading, page, status } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>
        <IssueList>
          <ListNavigation page={page}>
            <button
              className="decrement"
              type="button"
              onClick={() => this.decrementPage()}
            >
              <MdNavigateBefore />
            </button>
            <Filter>
              <input
                type="radio"
                name="filter"
                value="open"
                id="open"
                checked={status === 'open'}
                onChange={e => this.handleStatus(e)}
              />
              Abertas
              <input
                type="radio"
                name="filter"
                value="closed"
                id="closed"
                checked={status === 'closed'}
                onChange={e => this.handleStatus(e)}
              />
              Fechadas
              <input
                type="radio"
                name="filter"
                value="all"
                id="all"
                checked={status === 'all'}
                onChange={e => this.handleStatus(e)}
              />
              Todas
            </Filter>
            <button type="button" onClick={() => this.incrementPage()}>
              <MdNavigateNext />
            </button>
          </ListNavigation>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>
      </Container>
    );
  }
}
